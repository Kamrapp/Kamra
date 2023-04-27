using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Enums
{
    public enum AuthType
    {
        Regular,
        Google
    }

    public enum UserPermission
    {
        User,
        HH_Manager,
        Support,
        SA
    }
}
