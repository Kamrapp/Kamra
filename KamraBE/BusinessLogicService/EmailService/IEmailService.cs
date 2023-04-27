using Shared.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BusinessLogicService.EmailService
{
    public interface IEmailService
    {
        public bool SendMail(string to, string subject, string body);

        public Task<bool> SendVerifyMail(UserDto user, string lang);
    }
}
