#nullable disable
using Kamrapp.Model;

using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;

namespace Kamrapp.Pages.Elements
{
    public class IndexModel : PageModel
    {
        private readonly Kamrapp.Data.ApplicationDbContext _context;

        public IndexModel(Kamrapp.Data.ApplicationDbContext context)
        {
            _context = context;
        }

        public IList<Element> Element { get; set; }

        public async Task OnGetAsync()
        {
            Element = await _context.Elements.ToListAsync();
        }
    }
}
