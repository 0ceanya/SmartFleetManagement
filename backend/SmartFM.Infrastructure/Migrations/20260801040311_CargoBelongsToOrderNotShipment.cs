using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CargoBelongsToOrderNotShipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cargoes_Shipments_ShipmentId",
                table: "Cargoes");

            migrationBuilder.RenameColumn(
                name: "ShipmentId",
                table: "Cargoes",
                newName: "OrderId");

            migrationBuilder.RenameIndex(
                name: "IX_Cargoes_ShipmentId",
                table: "Cargoes",
                newName: "IX_Cargoes_OrderId");

            migrationBuilder.AddColumn<decimal>(
                name: "OrderWeightKg",
                table: "Orders",
                type: "TEXT",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "LineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    CargoId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    WeightKg = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    VolumeCbm = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineItems_Cargoes_CargoId",
                        column: x => x.CargoId,
                        principalTable: "Cargoes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LineItems_CargoId",
                table: "LineItems",
                column: "CargoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cargoes_Orders_OrderId",
                table: "Cargoes",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cargoes_Orders_OrderId",
                table: "Cargoes");

            migrationBuilder.DropTable(
                name: "LineItems");

            migrationBuilder.DropColumn(
                name: "OrderWeightKg",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "OrderId",
                table: "Cargoes",
                newName: "ShipmentId");

            migrationBuilder.RenameIndex(
                name: "IX_Cargoes_OrderId",
                table: "Cargoes",
                newName: "IX_Cargoes_ShipmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cargoes_Shipments_ShipmentId",
                table: "Cargoes",
                column: "ShipmentId",
                principalTable: "Shipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
