# Generated manually on 2025-12-22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('detection', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='materialdetection',
            old_name='user_qr_code',
            new_name='user_nfc_code',
        ),
    ]

