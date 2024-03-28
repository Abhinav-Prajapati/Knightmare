package db

import (
	"go-chess/db/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Database struct {
	db *gorm.DB
}

func NewDataBase() (*Database, error) {

	dsn := "host=localhost user=admin password=quickchess@admin dbname=test port=5432 sslmode=disable TimeZone=Asia/Kolkata"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// AutoMigrate models
	err = db.AutoMigrate(&models.User{})
	if err != nil {
		panic("failed to auto migrate users table ")
	}

	return &Database{db: db}, nil
}

func (d *Database) GetDB() *gorm.DB {
	return d.db
}
