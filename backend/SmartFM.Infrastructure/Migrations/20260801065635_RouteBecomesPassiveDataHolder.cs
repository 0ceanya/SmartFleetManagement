using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RouteBecomesPassiveDataHolder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DestinationWarehouseId",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "EstimatedDistanceKm",
                table: "Routes");

            migrationBuilder.RenameColumn(
                name: "OriginWarehouseId",
                table: "Routes",
                newName: "OriginAddress");

            migrationBuilder.RenameColumn(
                name: "EstimatedDurationHours",
                table: "Routes",
                newName: "DestinationAddress");

            migrationBuilder.AddColumn<double>(
                name: "DistanceKm",
                table: "Routes",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedDurationMinutes",
                table: "Routes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WaypointsJson",
                table: "Routes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "RouteId",
                table: "Assignments",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "TEXT");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_RouteId",
                table: "Assignments",
                column: "RouteId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assignments_Routes_RouteId",
                table: "Assignments",
                column: "RouteId",
                principalTable: "Routes",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assignments_Routes_RouteId",
                table: "Assignments");

            migrationBuilder.DropIndex(
                name: "IX_Assignments_RouteId",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "DistanceKm",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "EstimatedDurationMinutes",
                table: "Routes");

            migrationBuilder.DropColumn(
                name: "WaypointsJson",
                table: "Routes");

            migrationBuilder.RenameColumn(
                name: "OriginAddress",
                table: "Routes",
                newName: "OriginWarehouseId");

            migrationBuilder.RenameColumn(
                name: "DestinationAddress",
                table: "Routes",
                newName: "EstimatedDurationHours");

            migrationBuilder.AddColumn<Guid>(
                name: "DestinationWarehouseId",
                table: "Routes",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedDistanceKm",
                table: "Routes",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<Guid>(
                name: "RouteId",
                table: "Assignments",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
