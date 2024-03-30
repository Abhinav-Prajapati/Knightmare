package user

// TODO: move User to Modles
type User struct {
	ID       uint
	Username string
	Email    string
	Password string
}
type CreateUserReq struct {
	Username string
	Email    string
	Password string
}
type CreateUserRes struct {
	ID          string
	Username    string
	Email       string
	AccessToken string `json:"Token" db:"id"`
}

type LoginUserReq struct {
	Email    string `json:"email" db:"email"`
	Password string `json:"password" db:"password"`
}

type LoginUserRes struct {
	accessToken string
	ID          string `json:"id" db:"id"`
	Username    string `json:"username" db:"username"`
}

type LoginUserJwtRes struct {
	AccessToken string `json:"Token" db:"id"`
	ID          string `json:"id" db:"id"`
	Username    string `json:"username" db:"username"`
}

type Repository interface {
	CreateUser(user *User) (int64, error)
	GetUserByEmail(email string) (*User, error)
	FindEmail(email string) (bool, error)
}
type Service interface {
	CreateUser(req *CreateUserReq) (*CreateUserRes, error)
	Login(req *LoginUserReq) (*LoginUserRes, error)
}
