package user

import (
	"go-chess/db/models"

	"gorm.io/gorm"
)

type DBTX interface {
	Create(value interface{}) *gorm.DB
}

type repository struct {
	db DBTX
}

func NewRepository(db DBTX) Repository {
	return &repository{db: db}
}

func (r *repository) CreateUser(user *User) (int64, error) {
	// if 0 row is returned it indicated failure 1 indicate success
	newUser := models.User{
		Username: user.Username,
		Email:    user.Email,
		Password: user.Password,
	}
	result := r.db.Create(&newUser)

	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

// func (r *repository) FindByEmail(email string) (*domain.User, error) {
// 	// Implement find by email logic
// }
