using System.Net;
using System.Net.Mail;

namespace BusinessLogicService.EmailService
{
    public class EmailService : IEmailService
    {
        public bool SendMail(string to, string subject, string body)
        {
            try
            {
                var smtp = new SmtpClient
                {
                    Host = "smtp.gmail.com",
                    Port = 587,
                    EnableSsl = true,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential("info@kamra.hu", "Kanklakikon42")

                };
                using (var message = new MailMessage("info@kamra.hu", to)
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                })
                    smtp.Send(message);

                return true;
            }
            catch (Exception ex)
            {
                // i have no idea what kind of expections can happen...
                return false;
            }
        }

        public async Task<bool> SendVerifyMail(UserDto user, string lang)
        {
            var token = Hash.GetHashedString(user.ActivateLink + user.EmailAddress);
            var url = $"https://localhost:2022/api/user/Verify?addr={user.EmailAddress}&token={token}";

            var subject = "Kamra - Activation";
            var body = $@"<h2>Welcome to your larder!</h2><br/><br/>We are excited to tell you that your account is successfully created. Please click on the link below to verify your account<br/><br/><a href='{url}'>Click here to activate</a><br/><br/>Regards,<br/>Kamra Team";
            if (lang?.ToLower() == "hu")
            {
                subject = "Kamra - Aktiváció";
                body = $@"<h2>Üdvözlünk a kamrádban</h2><br/><br/>Jó hírrel tudunk szolgálni.<br/>A felhasználód elkészült! Már csak egy lépés választ el téged attól, hogy feltöltsd a kamrád.<br/>Kérjük aktiváld az email címed.<br/><br/><a href='{url}'>Aktiválás</a><br/><br/>Üdvözlettel,<br/>Kamra Team";
            }

            return SendMail(user.EmailAddress, subject, body);
        }
    }
}

