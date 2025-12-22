# Generated manually on 2025-12-22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('bins', '0003_bin_city'),
    ]

    operations = [
        migrations.RenameField(
            model_name='binusagelog',
            old_name='user_qr_code',
            new_name='user_nfc_code',
        ),
    ]

