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
    public class DetailsModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public DetailsModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public Element Element { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Element = await _context.Elements.FirstOrDefaultAsync(m => m.Id == id);

            if (Element == null)
            {
                return NotFound();
            }
            return Page();
        }
    }
}
