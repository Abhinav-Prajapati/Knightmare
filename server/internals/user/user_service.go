package user

import (
	"go-chess/utils"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

const (
	jwtSecretKey = "secretkey"
)

type service struct {
	Repository
}

func NewService(repository Repository) Service {
	return &service{repository}
}

func (s *service) CreateUser(req *CreateUserReq) (*CreateUserRes, error) {
	// TODO : return a struct (which includes new userid from db)

	// Hash the password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	u := &User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}
	user, err := s.Repository.CreateUser(u)

	if err != nil {
		return nil, err
	}

	return &CreateUserRes{ID: strconv.Itoa(int(user)), Username: req.Username, Email: req.Email}, nil
}

type jwtClame struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func (s *service) Login(req *LoginUserReq) (*LoginUserRes, error) {
	u, err := s.Repository.GetUserByEmail(req.Email)
	if err != nil {
		return &LoginUserRes{}, err
	}
	err = utils.CheakPassword(req.Password, u.Password)
	if err != nil {
		return &LoginUserRes{}, err
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, &jwtClame{
		ID:       strconv.Itoa(int(u.ID)),
		Username: u.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    strconv.Itoa(int(u.ID)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})
	signedString, err := token.SignedString([]byte(jwtSecretKey))
	if err != nil {
		return &LoginUserRes{}, err
	}

	return &LoginUserRes{
		ID:          strconv.Itoa(int(u.ID)),
		Username:    u.Username,
		accessToken: signedString,
	}, err
}
