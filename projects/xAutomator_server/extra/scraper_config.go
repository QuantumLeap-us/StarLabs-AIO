package extra

import (
	"gopkg.in/yaml.v3"
	"os"
)

type ProfilePictures struct {
	Scrape                   bool `yaml:"scrape"`
	UseProxiesForDownloading bool `yaml:"use_proxies_for_downloading"`
}

type BackgroundPictures struct {
	Scrape                   bool `yaml:"scrape"`
	UseProxiesForDownloading bool `yaml:"use_proxies_for_downloading"`
}

type Names struct {
	Scrape bool `yaml:"scrape"`
}

type Bios struct {
	Scrape bool `yaml:"scrape"`
}

type IDs struct {
	Scrape bool `yaml:"scrape"`
}

type Usernames struct {
	Scrape bool `yaml:"scrape"`
}

type Filter struct {
	MinimumFollowersCount  int    `yaml:"minimum_followers_count"`
	MinimumFollowingCount  int    `yaml:"minimum_following_count"`
	MinimumFavouritesCount int    `yaml:"minimum_favourites_count"`
	MinimumTweetsCount     int    `yaml:"minimum_tweets_count"`
	Verified               string `yaml:"verified"`
}

type ScraperConfig struct {
	ProfilePictures    ProfilePictures    `yaml:"profile_pictures"`
	BackgroundPictures BackgroundPictures `yaml:"background_pictures"`
	Names              Names              `yaml:"names"`
	Bios               Bios               `yaml:"bios"`
	IDs                IDs                `yaml:"ids"`
	Usernames          Usernames          `yaml:"usernames"`
	Filter             Filter             `yaml:"filter"`
}

func ReadScraperConfig() (ScraperConfig, error) {
	var config ScraperConfig
	yamlFile, err := os.ReadFile("scraper_config.yaml")
	if err != nil {
		return config, err
	}
	err = yaml.Unmarshal(yamlFile, &config)
	if err != nil {
		return config, err
	}
	return config, nil
}
