package user

import (
	"go-chess/utils"
)

type service struct {
	Repository
}

func NewService(repository Repository) Service {
	return &service{repository}
}

func (s *service) CreateUser(req *CreateUserReq) (int64, error) {
	// TODO : return a struct (which includes new userid from db)

	// Hash the password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return 0, err
	}

	u := &User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}
	user, err := s.Repository.CreateUser(u)

	if err != nil {
		return 0, err
	}

	return user, nil
}
