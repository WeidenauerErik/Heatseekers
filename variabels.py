last_temperature_alert_time = 0
last_humidity_alert_time = 0
last_flood_alert_time = 0
EMAIL_COOLDOWN = 300
reset_password_text = f"""
    <html>
      <body>
        <p>Dear Sir or Madam,</p>
        <p>This is your new password: <b>random_password</b></p>
        <p>For security reasons, please make sure to change your password immediately after logging in for the first time.</p>
        <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
        <p>Kind regards,<br>
           HeatSeeker<br>
           HTL Rennweg</p>
        <img src="cid:logo_image" alt="HeatSeekers Logo" style="width:200px;height:auto;">
      </body>
    </html>
    """
create_user_password_text = f"""
        <html>
          <body>
            <p>Dear Sir or Madam,</p>
            <p>We are providing you with your new account password: <b>random_password</b></p>
            <p>For security reasons, please make sure to change your password immediately after logging in for the first time.</p>
            <p>If you have any questions or need further assistance, please do not hesitate to contact us.</p>
            <p>Kind regards,<br>
               HeatSeeker<br>
               HTL Rennweg</p>
            <img src="cid:logo_image" alt="HeatSeekers Logo" style="width:200px;height:auto;">
          </body>
        </html>
        """