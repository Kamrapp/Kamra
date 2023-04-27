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
        public static List<UserPermission> UserRoles = new List<UserPermission>() { UserPermission.User, UserPermission.HH_Manager, UserPermission.Support, UserPermission.SA };

        public RolesAuthorizeAttribute(params UserPermission[] roles) : base()
        {
            // if only 1 role defined, than every role authorized below(above?) it
            // else any role that we defined can use the api
            if(roles.Count() == 1)
            {
                Roles = string.Join(",", UserRoles.Where(x=>(int)x >= (int)roles[0]).Select(x=>x.ToString()));
            }
            else
            {
                Roles = string.Join(",", roles.Select(x => x.ToString()));
            }
        }
    }
}

