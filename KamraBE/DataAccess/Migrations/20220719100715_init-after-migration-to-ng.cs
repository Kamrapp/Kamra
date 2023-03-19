using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    public partial class initaftermigrationtong : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Elements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GlobalName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GTIN = table.Column<int>(type: "int", nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TagList = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Elements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Households",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Households", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Components",
                columns: table => new
                {
                    ParentElementId = table.Column<int>(type: "int", nullable: false),
                    ChildElementId = table.Column<int>(type: "int", nullable: false),
                    Ratio = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Components", x => new { x.ParentElementId, x.ChildElementId });
                    table.ForeignKey(
                        name: "FK_Components_Elements_ChildElementId",
                        column: x => x.ChildElementId,
                        principalTable: "Elements",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Components_Elements_ParentElementId",
                        column: x => x.ParentElementId,
                        principalTable: "Elements",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Stocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ElementId = table.Column<int>(type: "int", nullable: false),
                    HouseholdId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ValidTill = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Quantity = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Stocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Stocks_Elements_ElementId",
                        column: x => x.ElementId,
                        principalTable: "Elements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Stocks_Households_HouseholdId",
                        column: x => x.HouseholdId,
                        principalTable: "Households",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Element2Tags",
                columns: table => new
                {
                    TagId = table.Column<int>(type: "int", nullable: false),
                    ElementId = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Element2Tags", x => new { x.ElementId, x.TagId });
                    table.ForeignKey(
                        name: "FK_Element2Tags_Elements_ElementId",
                        column: x => x.ElementId,
                        principalTable: "Elements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Element2Tags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Properties",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    ValueListType = table.Column<int>(type: "int", nullable: false),
                    TagId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Properties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Properties_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Tag2Tags",
                columns: table => new
                {
                    ParentTagId = table.Column<int>(type: "int", nullable: false),
                    ChildTagId = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tag2Tags", x => new { x.ParentTagId, x.ChildTagId });
                    table.ForeignKey(
                        name: "FK_Tag2Tags_Tags_ChildTagId",
                        column: x => x.ChildTagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Tag2Tags_Tags_ParentTagId",
                        column: x => x.ParentTagId,
                        principalTable: "Tags",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PropertyValues",
                columns: table => new
                {
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    Bool = table.Column<bool>(type: "bit", nullable: false),
                    String = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Int = table.Column<int>(type: "int", nullable: false),
                    Double = table.Column<double>(type: "float", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Element2TagElementId = table.Column<int>(type: "int", nullable: true),
                    Element2TagTagId = table.Column<int>(type: "int", nullable: true),
                    Tag2TagChildTagId = table.Column<int>(type: "int", nullable: true),
                    Tag2TagParentTagId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyValues", x => new { x.PropertyId, x.Bool, x.String, x.Double, x.Int });
                    table.ForeignKey(
                        name: "FK_PropertyValues_Element2Tags_Element2TagElementId_Element2TagTagId",
                        columns: x => new { x.Element2TagElementId, x.Element2TagTagId },
                        principalTable: "Element2Tags",
                        principalColumns: new[] { "ElementId", "TagId" });
                    table.ForeignKey(
                        name: "FK_PropertyValues_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PropertyValues_Tag2Tags_Tag2TagParentTagId_Tag2TagChildTagId",
                        columns: x => new { x.Tag2TagParentTagId, x.Tag2TagChildTagId },
                        principalTable: "Tag2Tags",
                        principalColumns: new[] { "ParentTagId", "ChildTagId" });
                });

            migrationBuilder.CreateIndex(
                name: "IX_Components_ChildElementId",
                table: "Components",
                column: "ChildElementId");

            migrationBuilder.CreateIndex(
                name: "IX_Element2Tags_TagId",
                table: "Element2Tags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_TagId",
                table: "Properties",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyValues_Element2TagElementId_Element2TagTagId",
                table: "PropertyValues",
                columns: new[] { "Element2TagElementId", "Element2TagTagId" });

            migrationBuilder.CreateIndex(
                name: "IX_PropertyValues_Tag2TagParentTagId_Tag2TagChildTagId",
                table: "PropertyValues",
                columns: new[] { "Tag2TagParentTagId", "Tag2TagChildTagId" });

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_ElementId",
                table: "Stocks",
                column: "ElementId");

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_HouseholdId",
                table: "Stocks",
                column: "HouseholdId");

            migrationBuilder.CreateIndex(
                name: "IX_Tag2Tags_ChildTagId",
                table: "Tag2Tags",
                column: "ChildTagId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Components");

            migrationBuilder.DropTable(
                name: "PropertyValues");

            migrationBuilder.DropTable(
                name: "Stocks");

            migrationBuilder.DropTable(
                name: "Element2Tags");

            migrationBuilder.DropTable(
                name: "Properties");

            migrationBuilder.DropTable(
                name: "Tag2Tags");

            migrationBuilder.DropTable(
                name: "Households");

            migrationBuilder.DropTable(
                name: "Elements");

            migrationBuilder.DropTable(
                name: "Tags");
        }
    }
}
