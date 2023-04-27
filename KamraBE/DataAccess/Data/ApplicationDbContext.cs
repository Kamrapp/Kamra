using DataAccess.Models;
using Microsoft.EntityFrameworkCore;
namespace DataAccess.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Element> Elements { get; set; }
        public DbSet<Component> Components { get; set; }
        public DbSet<Element2Tag> Element2Tags { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<PropertyValue> PropertyValues { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Tag2Tag> Tag2Tags { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<Household> Households { get; set; }
        public DbSet<User> Users { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            #region Renaming Tables
            builder.Entity<Property>().ToTable("Properties");
            #endregion Renaming Tables
            #region Primary Keys
            builder.Entity<Component>()
                .HasKey(c => new
                {
                    c.ParentElementId,
                    c.ChildElementId
                });
            builder.Entity<Tag2Tag>()
                .HasKey(t2t => new
                {
                    t2t.ParentTagId,
                    t2t.ChildTagId
                });
            builder.Entity<Element2Tag>()
                .HasKey(e2t => new
                {
                    e2t.ElementId,
                    e2t.TagId
                });
            builder.Entity<PropertyValue>()
                .HasKey(pv => new
                {
                    pv.PropertyId,
                    pv.Bool,
                    pv.String,
                    pv.Double,
                    pv.Int
                });
            #endregion Primary Keys
            #region Connections
            builder.Entity<Element>()
                .HasMany(e => e.Components)
                .WithOne(p => p.ParentElement)
                .HasForeignKey(comp => comp.ParentElementId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Element>()
                .HasMany(e => e.ParentComponents)
                .WithOne(p => p.ChildElement)
                .HasForeignKey(comp => comp.ChildElementId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Tag>()
                .HasMany(t => t.Tag2Tags)
                .WithOne(p => p.ParentTag)
                .HasForeignKey(t2t => t2t.ParentTagId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.Entity<Tag>()
                .HasMany(t => t.ParentTag2Tags)
                .WithOne(p => p.ChildTag)
                .HasForeignKey(t2t => t2t.ChildTagId)
                .OnDelete(DeleteBehavior.NoAction);
            #endregion Connections
        }
    }
}