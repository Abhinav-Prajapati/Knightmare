package user

import (
	"go-chess/db/models"

	"gorm.io/gorm"
)

// according to my understanding DBTX (interface) should how have type of *grom.db (struct) ??? my be
type DBTX interface {
	// add all gorm function which is are beeing used
	Create(value interface{}) *gorm.DB
	Where(query interface{}, args ...interface{}) (tx *gorm.DB)
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

func (r *repository) GetUserByEmail(email string) (*User, error) {

	u := models.User{}

	result := r.db.Where("email = ?", email).First(&u)
	if result.Error != nil {
		return &User{}, nil
	}

	res := User{
		ID:       u.ID,
		Email:    u.Email,
		Username: u.Username,
		Password: u.Password,
	}

	return &res, nil
}
