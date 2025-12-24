# Generated manually for capacity tracking feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bins', '0004_rename_user_qr_code_to_user_nfc_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='bin',
            name='current_capacity_used',
            field=models.DecimalField(decimal_places=2, default=0.0, help_text='Current capacity used in liters', max_digits=10),
        ),
    ]

