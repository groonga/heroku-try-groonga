# Try Groonga

It is a Web application to try Groonga without installing Groonga on
your machine.

## How to use?

Try: http://try-groonga.herokuapp.com/

## How to deploy?

    % git clone https://github.com/groonga/heroku-try-groonga.git
    % cd heroku-try-groonga
    % heroku apps:create --buildpack https://codon-buildpacks.s3.amazonaws.com/buildpacks/groonga/rroonga.tgz
    % git push heroku master
    % heroku apps:open

## How to run on local machine?

    % git clone https://github.com/groonga/heroku-try-groonga.git
    % cd heroku-try-groonga
    % bundle install
    % bundle exec foreman start

Open: http://localhost:5000/

## License

The MIT License.

  * Copyright (c) 2014 Kouhei Sutou

## Help us!

  * Design me!
  * Support scroll.
  * Support larger font size.
