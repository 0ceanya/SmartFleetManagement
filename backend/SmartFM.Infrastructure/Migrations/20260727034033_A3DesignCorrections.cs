using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class A3DesignCorrections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Shipments_OrderId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "ShipmentId",
                table: "Assignments");

            migrationBuilder.AddColumn<decimal>(
                name: "CapacityKg",
                table: "Warehouses",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignmentId",
                table: "Shipments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "Shipments",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<double>(
                name: "GpsLatitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "GpsLongitude",
                table: "DeliveryConfirmations",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "ProofSignature",
                table: "DeliveryConfirmations",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_AssignmentId",
                table: "Shipments",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_OrderId",
                table: "Shipments",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Assignments_AssignmentId",
                table: "Shipments",
                column: "AssignmentId",
                principalTable: "Assignments",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Assignments_AssignmentId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_AssignmentId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_OrderId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "CapacityKg",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "AssignmentId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "GpsLatitude",
                table: "DeliveryConfirmations");

            migrationBuilder.DropColumn(
                name: "GpsLongitude",
                table: "DeliveryConfirmations");

            migrationBuilder.DropColumn(
                name: "ProofSignature",
                table: "DeliveryConfirmations");

            migrationBuilder.AddColumn<Guid>(
                name: "ShipmentId",
                table: "Assignments",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_OrderId",
                table: "Shipments",
                column: "OrderId",
                unique: true);
        }
    }
}
