package user

// TODO: move User to Modles
type User struct {
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

type Repository interface {
	CreateUser(user *User) (int64, error)
	// GetUserByEmail(email string) (*User, error)
}
type Service interface {
	CreateUser(req *CreateUserReq) (int64, error)
	// Ping()
	// Login(c context.Context, req *LoginUserReq) (*LoginUserRes, error)
}
