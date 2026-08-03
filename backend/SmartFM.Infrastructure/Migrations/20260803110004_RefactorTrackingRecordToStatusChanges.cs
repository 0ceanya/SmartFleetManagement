using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartFM.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RefactorTrackingRecordToStatusChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Remove stale GPS-based tracking rows before restructuring columns
            migrationBuilder.Sql("DELETE FROM Records WHERE RecordType = 'Tracking'");

            migrationBuilder.DropColumn(
                name: "Lat",
                table: "Records");

            migrationBuilder.DropColumn(
                name: "Lon",
                table: "Records");

            migrationBuilder.RenameColumn(
                name: "TrackingRecord_VehicleId",
                table: "Records",
                newName: "ToStatus");

            migrationBuilder.RenameColumn(
                name: "TrackingRecord_ShipmentId",
                table: "Records",
                newName: "FromStatus");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Records",
                newName: "EntityType");

            migrationBuilder.AddColumn<string>(
                name: "ChangedBy",
                table: "Records",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "EntityId",
                table: "Records",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ChangedBy",
                table: "Records");

            migrationBuilder.DropColumn(
                name: "EntityId",
                table: "Records");

            migrationBuilder.RenameColumn(
                name: "ToStatus",
                table: "Records",
                newName: "TrackingRecord_VehicleId");

            migrationBuilder.RenameColumn(
                name: "FromStatus",
                table: "Records",
                newName: "TrackingRecord_ShipmentId");

            migrationBuilder.RenameColumn(
                name: "EntityType",
                table: "Records",
                newName: "Status");

            migrationBuilder.AddColumn<double>(
                name: "Lat",
                table: "Records",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Lon",
                table: "Records",
                type: "REAL",
                nullable: true);
        }
    }
}
