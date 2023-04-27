namespace BusinessLogicService.EmailService
{
    public interface IEmailService
    {
        public bool SendMail(string to, string subject, string body);

        public Task<bool> SendVerifyMail(UserDto user, string lang);
    }
}
