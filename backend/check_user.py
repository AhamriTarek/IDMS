import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'idms.settings')
django.setup()

from django.contrib.auth import get_user_model
from allauth.socialaccount.models import SocialAccount

User = get_user_model()
email = 'tarek.ahamri@usmba.ac.ma'
u = User.objects.filter(email=email).first()

if u:
    print(f"User exists: id={u.id} username={u.username!r} email={u.email!r}")
    print(f"  is_superuser={u.is_superuser} is_staff={u.is_staff}")
    u.is_superuser = True
    u.is_staff = True
    u.save(update_fields=['is_superuser', 'is_staff'])
    print("  Admin role confirmed.")
    sa = SocialAccount.objects.filter(user=u, provider='google').first()
    if sa:
        print(f"  SocialAccount uid={sa.uid}")
    else:
        print("  No SocialAccount linked yet (first login not completed)")
else:
    print(f"User NOT found for {email}")
    print("All users:")
    for x in User.objects.all().values('id', 'username', 'email', 'is_superuser'):
        print(" ", x)
