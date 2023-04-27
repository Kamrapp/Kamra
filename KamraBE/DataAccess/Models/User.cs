using DataAccess.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        public string UserName { get; set; }

        public string Password { get; set; }

        public bool Activated { get; set; }

        public string ActivateLink { get; set; }

        [Required]
        public string EmailAddress { get; set; }

        public DateTime CreatedDate { get; set; }

        [Required]
        public AuthType AuthType { get; set; }

        [Required]
        public UserPermission UserPermission { get; set; }

        [ForeignKey(nameof(Household))]
        public int? HouseHoldId { get; set; }
        public virtual Household? Household { get; set; }
    }
}
