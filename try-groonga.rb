require "fileutils"

require "sinatra/base"

class TryGroonga < Sinatra::Base
  def initialize(app=nil)
    super
    @sessions = {}
  end

  post "/sessions/:id" do
    @sessions[params[:id]] ||= Session.new(params[:id])
    session = @sessions[params[:id]]

    command_line = request.body.read
    result = session.execute(command_line)
    if result.start_with?("[")
      content_type "application/json"
    else
      content_type "text/plain"
    end
    result
  end

  class Session
    def initialize(id)
      @id = id
      ensure_database
      invoke_groonga
    end

    def execute(command)
      send_request(command)
      receive_response
    end

    private
    def database_path
      File.join("groonga", "databases", @id, "db")
    end

    def ensure_database
      return if File.exist?(database_path)

      FileUtils.mkdir_p(File.dirname(database_path))
      IO.pipe do |read_in, read_out|
        options = {
          :out => read_out,
          :err => read_out,
        }
        pid = spawn("groonga", "-n", database_path, "shutdown", options)
        read_out.close
        Process.waitpid(pid)
        read_in.read
      end
    end

    def invoke_groonga
      in_read, in_write = IO.pipe
      out_read, out_write = IO.pipe
      env = {}
      options = {
        in_read => in_read,
        out_write => out_write,
      }
      @groonga_pid = spawn("groonga",
                           "--input-fd", in_read.fileno.to_s,
                           "--output-fd", out_write.fileno.to_s,
                           database_path,
                           options)
      in_read.close
      @input = in_write
      out_write.close
      @output = out_read
    end

    def send_request(command)
      command.each_line do |line|
        @input.puts(line)
        @input.flush
      end
    end

    def receive_response
      response = ""
      timeout = 5
      loop do
        readables, = IO.select([@output], [], [], timeout)
        break if readables.nil?
        timeout = 0
        readables.each do |readable|
          response << readable.readpartial(4096)
        end
      end
      response
    end
  end
end
