import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'idms.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from dotenv import load_dotenv
load_dotenv()

print("All SocialApps before:")
for a in SocialApp.objects.all():
    print(f"  id={a.id} provider={a.provider!r} name={a.name!r} client_id={a.client_id[:20] if a.client_id else 'EMPTY'}")

deleted, _ = SocialApp.objects.all().delete()
print(f"Deleted {deleted} record(s)")

site, _ = Site.objects.get_or_create(id=1, defaults={'domain': 'localhost:8000', 'name': 'localhost'})
site.domain = 'localhost:8000'
site.name   = 'localhost'
site.save()

app = SocialApp.objects.create(
    provider='google',
    name='Google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID', ''),
    secret=os.environ.get('GOOGLE_CLIENT_SECRET', ''),
)
app.sites.add(site)
print(f"Created SocialApp id={app.id}")
print(f"  client_id : {app.client_id[:40]}")
print(f"  sites     : {list(app.sites.values_list('domain', flat=True))}")
print("Done.")
