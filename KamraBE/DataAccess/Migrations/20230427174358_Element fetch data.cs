using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    public partial class Elementfetchdata : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Distributor",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MongoId",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PictureUri",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Url",
                table: "Elements",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Elements");

            migrationBuilder.DropColumn(
                name: "Distributor",
                table: "Elements");

            migrationBuilder.DropColumn(
                name: "MongoId",
                table: "Elements");

            migrationBuilder.DropColumn(
                name: "PictureUri",
                table: "Elements");

            migrationBuilder.DropColumn(
                name: "Url",
                table: "Elements");
        }
    }
}
