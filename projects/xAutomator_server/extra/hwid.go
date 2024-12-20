package extra

import (
	"fmt"
	"strings"

	"github.com/StackExchange/wmi"
)

type Win32_ComputerSystemProduct struct {
	UUID string
}

func GetHWID() (string, error) {
	var dst []Win32_ComputerSystemProduct
	query := wmi.CreateQuery(&dst, "")
	err := wmi.Query(query, &dst)
	if err != nil {
		return "", err
	}
	if len(dst) == 0 {
		return "", fmt.Errorf("no results from WMI query")
	}

	uuid := strings.TrimSpace(dst[0].UUID)
	if uuid == "" {
		return "", fmt.Errorf("UUID is empty")
	}

	return uuid, nil
}
