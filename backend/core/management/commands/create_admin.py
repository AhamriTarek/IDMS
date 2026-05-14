"""
Management command to create the IDMS admin account.
Usage: py manage.py create_admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Administrateur


class Command(BaseCommand):
    help = 'Create the default IDMS admin account'

    def handle(self, *args, **options):
        email    = 'tarek.ahamri@usmba.ac.ma'
        username = 'tarek.ahamri'
        password = 'TAREK999'

        # Create / update User
        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                'email':        email,
                'first_name':   'Tarek',
                'last_name':    'Ahamri',
                'is_staff':     True,
                'is_superuser': True,
            }
        )

        if not user_created:
            user.email        = email
            user.is_staff     = True
            user.is_superuser = True
            self.stdout.write(self.style.WARNING('[INFO] User already existed - updated.'))
        else:
            self.stdout.write(self.style.SUCCESS('[OK] User created: ' + username))

        user.set_password(password)
        user.save()

        # Create / update Administrateur profile
        adm, adm_created = Administrateur.objects.get_or_create(
            user=user,
            defaults={'nom': 'Ahamri', 'prenom': 'Tarek'},
        )
        if adm_created:
            self.stdout.write(self.style.SUCCESS('[OK] Administrateur profile created.'))
        else:
            self.stdout.write(self.style.WARNING('[INFO] Administrateur profile already existed.'))

        self.stdout.write('')
        self.stdout.write('  Email    : ' + email)
        self.stdout.write('  Username : ' + username)
        self.stdout.write('  Password : ' + password)
        self.stdout.write('  Role     : Admin')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('[DONE] Login at http://localhost:5173'))
