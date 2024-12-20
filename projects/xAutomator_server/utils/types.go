package utils

type ScraperChannelData struct {
	Names              []string
	Usernames          []string
	Bios               []string
	BackgroundPictures []string
	ProfilePictures    []string
	ScrapedUsers       []string
}

type ScrapedUser struct {
	ID                   string
	Name                 string
	Username             string
	Description          string
	ProfilePictureURL    string
	BackgroundPictureURL any
	RepliesText          string
}
