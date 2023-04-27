using DataAccess.Enums;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Web;

namespace KamraAPI.External
{
    public class RolesAuthorizeAttribute : AuthorizeAttribute
    {
        public RolesAuthorizeAttribute(params UserPermission[] roles) : base()
        {
            Roles = string.Join(",", roles.Select(x => x.ToString()));
        }
    }
}

