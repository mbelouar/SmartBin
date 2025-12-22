# Generated manually on 2025-12-22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('reclamations', '0002_delete_reclamationattachment'),
    ]

    operations = [
        migrations.RenameField(
            model_name='reclamation',
            old_name='user_qr_code',
            new_name='user_nfc_code',
        ),
    ]

