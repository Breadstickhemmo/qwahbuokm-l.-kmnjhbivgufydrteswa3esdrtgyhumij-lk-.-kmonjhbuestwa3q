import click
from flask.cli import with_appcontext
from .extensions import db
from .models import User

@click.command(name='make-admin')
@click.argument('email')
@with_appcontext
def make_admin(email):
    user = User.query.filter_by(email=email).first()
    if user:
        user.is_admin = True
        db.session.commit()
        print(f"Пользователь {email} теперь является администратором.")
    else:
        print(f"Пользователь с email {email} не найден.")

def init_app(app):
    app.cli.add_command(make_admin)