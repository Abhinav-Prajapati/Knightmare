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
	ID       string
	Username string
	Email    string
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

type Repository interface {
	CreateUser(user *User) (int64, error)
	GetUserByEmail(email string) (*User, error)
}
type Service interface {
	CreateUser(req *CreateUserReq) (int64, error)
	Login(req *LoginUserReq) (*LoginUserRes, error)
}
