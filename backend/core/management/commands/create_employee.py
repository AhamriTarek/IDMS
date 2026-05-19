"""
Management command to create a test employee account.
Usage: py manage.py create_employee
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Employe, TypeEmploye


class Command(BaseCommand):
    help = 'Create a test employee account'

    def handle(self, *args, **options):
        email    = 'employee@example.com'
        username = 'employee'
        password = 'Employee123!'
        nom      = 'Dupont'
        prenom   = 'Marie'

        # Get or create a TypeEmploye
        type_emp, _ = TypeEmploye.objects.get_or_create(
            nom='Standard',
            defaults={'description': 'Standard employee type'}
        )

        # Create / update User
        user, user_created = User.objects.get_or_create(
            username=username,
            defaults={
                'email':        email,
                'first_name':   prenom,
                'last_name':    nom,
                'is_staff':     False,
                'is_superuser': False,
            }
        )

        if not user_created:
            user.email = email
            user.is_staff = False
            user.is_superuser = False
            self.stdout.write(self.style.WARNING('[INFO] User already existed - updated.'))
        else:
            self.stdout.write(self.style.SUCCESS('[OK] User created: ' + username))

        user.set_password(password)
        user.save()

        # Create / update Employe profile
        emp, emp_created = Employe.objects.get_or_create(
            user=user,
            defaults={'nom': nom, 'prenom': prenom, 'type_employe': type_emp},
        )
        if emp_created:
            self.stdout.write(self.style.SUCCESS('[OK] Employe profile created.'))
        else:
            self.stdout.write(self.style.WARNING('[INFO] Employe profile already existed.'))

        self.stdout.write('')
        self.stdout.write('  Email    : ' + email)
        self.stdout.write('  Username : ' + username)
        self.stdout.write('  Password : ' + password)
        self.stdout.write('  Role     : Employee')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('[DONE] Login at http://localhost:5173'))
