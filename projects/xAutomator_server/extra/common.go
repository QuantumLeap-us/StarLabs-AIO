package extra

import (
	http "github.com/bogdanfinn/fhttp"
	"math/rand"
	"strings"
	"time"
)

func RandomSleep(min, max int) {
	if min > max {
		min, max = max, min
	}
	duration := rand.Intn(max-min+1) + min
	time.Sleep(time.Duration(duration) * time.Second)
}

func ChangeProxyURL(link string) bool {
	for i := 0; i < 3; i++ {
		c := http.Client{}
		req, err := http.NewRequest("GET", link, strings.NewReader(""))

		if err != nil {
			Logger{}.Error("Failed to change mobile proxy IP: %s", err)
			continue
		}

		req.Header = http.Header{
			"user-agent": {"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"},
		}

		_, err = c.Do(req)
		if err != nil {
			Logger{}.Error("Failed to change mobile proxy IP: %s", err)
			continue
		}
		return true
	}
	return false
}

func SplitAt(s, sep string) (string, string) {
	parts := strings.SplitN(s, sep, 2)
	if len(parts) != 2 {
		return "", ""
	}
	return parts[0], parts[1]
}

func IsElementInSlice(userChoice []string, subString string) bool {
	for _, choice := range userChoice {
		if strings.Contains(choice, subString) {
			return true
		}
	}
	return false
}

func ChunkSlice(slice []string, chunkSize int) [][]string {
	var chunks [][]string
	for i := 0; i < len(slice); i += chunkSize {
		end := i + chunkSize
		if end > len(slice) {
			end = len(slice)
		}
		chunks = append(chunks, slice[i:end])
	}
	return chunks
}

func GetRandomValue(slice []string) string {
	if len(slice) == 0 {
		return ""
	}
	rand.Seed(time.Now().UnixNano())
	randomIndex := rand.Intn(len(slice))
	return slice[randomIndex]
}

func CreateBoostList(firstSlice []string, secondSlice []string, repeatCount int) map[string][]string {
       // Создаем результирующий словарь
	   result := make(map[string][]string)
	   for _, key := range firstSlice {
		   result[key] = make([]string, 0)
	   }
	   
	   // Для каждой строки из второго слайса
	   for _, str := range secondSlice {
		   // Создаем копию первого слайса для случайного выбора
		   availableKeys := make([]string, len(firstSlice))
		   copy(availableKeys, firstSlice)
		   
		   // Выбираем repeatCount случайных ключей для текущей строки
		   for i := 0; i < repeatCount && len(availableKeys) > 0; i++ {
			   // Выбираем случайный ключ из доступных
			   randomIndex := rand.Intn(len(availableKeys))
			   selectedKey := availableKeys[randomIndex]
			   
			   // Добавляем строку к выбранному ключу
			   result[selectedKey] = append(result[selectedKey], str)
			   
			   // Удаляем использованный ключ из доступных
			   availableKeys = append(availableKeys[:randomIndex], availableKeys[randomIndex+1:]...)
		   }
	   }
	   
	   return result
}