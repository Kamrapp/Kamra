using DataAccess.Enums;

namespace Shared.Dtos
{
    public class ElementDto
    {
        public int Id { get; set; }

        public string UserName { get; set; }

        public string EmailAddress { get; set; }

        public UserPermission UserPermission { get; set; }

        public int? HouseholdId { get; set; }

        public string ActivateLink { get; set; }
    }
}
