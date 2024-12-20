package extra

import (
	"fmt"
	"io"
	"strings"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

const listHeight = 20

var (
	titleStyle        = lipgloss.NewStyle().MarginLeft(2).Bold(true).Foreground(lipgloss.Color("#FFA500"))
	sectionTitleStyle = lipgloss.NewStyle().MarginLeft(2).Bold(true).Foreground(lipgloss.Color("120")).Padding(0, 0)
	itemStyle         = lipgloss.NewStyle().PaddingLeft(2).Foreground(lipgloss.Color("270"))
	numberStyle       = lipgloss.NewStyle().Foreground(lipgloss.Color("110"))
	selectedItemStyle = lipgloss.NewStyle().PaddingLeft(3).Foreground(lipgloss.Color("120")).Bold(true).BorderBottom(true)
	helpStyle         = lipgloss.NewStyle().MarginLeft(2).Bold(true).Foreground(lipgloss.Color("240"))
	quitTextStyle     = lipgloss.NewStyle().Margin(1, 0, 2, 4)
)

type item struct {
	section string
	title   string
}

func (i item) FilterValue() string { return "" }

type itemDelegate struct{}

func (d itemDelegate) Height() int                             { return 1 }
func (d itemDelegate) Spacing() int                            { return 0 }
func (d itemDelegate) Update(_ tea.Msg, _ *list.Model) tea.Cmd { return nil }
func (d itemDelegate) Render(w io.Writer, m list.Model, index int, listItem list.Item) {
	i, ok := listItem.(item)
	if !ok {
		return
	}

	str := fmt.Sprintf("[%s] %s", numberStyle.Render(fmt.Sprintf("%d", index+1)), i.title)

	fn := itemStyle.Render
	if index == m.Index() {
		fn = func(s ...string) string {
			return selectedItemStyle.Render("> " + strings.Join(s, " "))
		}
	}

	fmt.Fprint(w, fn(str))
}

type model struct {
	list        list.Model
	selected    map[int]struct{}
	quitting    bool
	showMessage bool
}

func (m model) Init() tea.Cmd {
	return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.list.SetWidth(msg.Width)
		return m, nil

	case tea.KeyMsg:
		switch keypress := msg.String(); keypress {
		case "q", "ctrl+c":
			m.quitting = true
			return m, tea.Quit

		case "enter":
			index := m.list.Index()
			if m.list.Items()[index].(item).title == "Start" { // If "Start" is selected
				m.quitting = true
				m.showMessage = true
				return m, tea.Quit
			}
			if _, ok := m.selected[index]; ok {
				delete(m.selected, index)
			} else {
				m.selected[index] = struct{}{}
			}
		}
	}

	var cmd tea.Cmd
	m.list, cmd = m.list.Update(msg)
	return m, cmd
}

func (m model) View() string {
	if m.quitting {
		return ""
	}

	s := "\n" + titleStyle.Render(m.list.Title) + "\n\n"
	section := ""
	for i, listItem := range m.list.Items() {
		it := listItem.(item)
		if it.section != section && it.section != "" {
			section = it.section
			if i != 0 {
				s += "\n" // Add padding between sublists
			}
			s += sectionTitleStyle.Render(section) + "\n"
		}
		cursor := "  "
		if i == m.list.Index() {
			cursor = "->"
		}
		number := numberStyle.Render(fmt.Sprintf("[%d]", i+1))
		str := fmt.Sprintf("%s %s", number, it.title)
		if i == m.list.Index() {
			if _, ok := m.selected[i]; ok {
				s += selectedItemStyle.Render(fmt.Sprintf("%s %s [x]", cursor, str)) + "\n"
			} else {
				s += selectedItemStyle.Render(fmt.Sprintf("%s %s", cursor, str)) + "\n"
			}
		} else {
			if _, ok := m.selected[i]; ok {
				s += fmt.Sprintf("%s %s [x]\n", cursor, str)
			} else {
				s += fmt.Sprintf("%s %s\n", cursor, str)
			}
		}
	}
	s += helpStyle.Render("\nUse ↓↑ keys to navigate. Use Enter to select. \nWhen you are ready press Start button from the menu list. \nPress Ctrl+/Ctrl- to zoom in/out. Press Ctrl+C to quit.\n")
	return s
}

func createMenuWithSections(sections [][]string) ([]string, error) {
	items := []list.Item{}
	for _, section := range sections {
		if len(section) > 0 {
			title := section[0]
			for _, el := range section[1:] {
				items = append(items, item{section: title, title: el})
			}
		}
	}
	items = append(items, item{section: "Options", title: "Start"}) // Add "Start" button in "Options" submenu

	const defaultWidth = 30

	l := list.New(items, itemDelegate{}, defaultWidth, listHeight)
	l.Title = "Welcome to ExAutomator!\nContact: @devops\nVersion: 0.93"
	l.SetShowStatusBar(false)
	l.SetFilteringEnabled(false)
	l.SetShowPagination(false) // Disable pagination to show all items
	l.Styles.Title = titleStyle
	l.Styles.HelpStyle = helpStyle

	m := model{list: l, selected: make(map[int]struct{})}

	p := tea.NewProgram(m)
	finalModel, err := p.Run()
	if err != nil {
		return nil, fmt.Errorf("Error running program: %v", err)
	}

	var choices []string
	for i := range finalModel.(model).selected {
		if finalModel.(model).list.Items()[i].(item).title != "Start" {
			choices = append(choices, finalModel.(model).list.Items()[i].(item).title)
		}
	}

	return choices, nil
}

func ShowMainMenu() []string {
	sections := [][]string{
		{
			"Mass actions",
			"Follow",
			"Retweet",
			"Like",
			"Tweet",
			"Tweet with Picture",
			"Quote Tweet",
			"Comment with Picture",
			"Comment",
			"Unfollow",
			"Unlike",
			"Unretweet",
			"Mutual Subscription",
			"Vote in the poll",
			"Unfreeze Accounts",
			"Check if account is valid",
			"Account's BrutForce",
		},
		{
			"Account changer",
			"Change profile Picture",
			"Change Description",
			"Change Background",
			"Change Birthdate",
			"Change Password",
			"Change Username",
			"Change Location",
			"Change Name",
		},
		{
			"Scraping",
			"Scrape Followings",
			"Scrape Retweets",
			"Scrape Followers",
			"Scrape Likes",
			"Download all parsed pictures",
			"Get account creation date by username",
			"Filter accounts for BrutForce",
			"Username to user ID",
		},
	}

	choices, err := createMenuWithSections(sections)
	if err != nil {
		return []string{}
	}

	return choices
}
