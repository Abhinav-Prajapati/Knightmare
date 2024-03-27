package user

import "gorm.io/gorm"

type User struct {
	gorm.Model
	ID       uint64
	Username string
	Email    string `gorm:"unique"`
	Password string
}
