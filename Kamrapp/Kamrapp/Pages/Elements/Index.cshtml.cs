#nullable disable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Kamrapp.Data;
using Kamrapp.Model;

namespace Kamrapp.Pages.Elements
{
    public class IndexModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public IndexModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IList<Element> Element { get;set; }

        public async Task OnGetAsync()
        {
            Element = await _context.Elements.ToListAsync();
        }
    }
}
