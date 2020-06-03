package main

import (
	"fmt"
	"net/http"
	"os"
)

const (
	host     = "localhost"
	port     = 5432
	user     = "BaileySpell"
	password = os.Getenv(POSTGRES_PASSWORD)
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "You have hit the endpoint")
}

func addItem(w http.ResponseWriter, req *http.Request) {

}

func main() {
	http.HandleFunc("/", hello)
	http.HandleFunc("/addItem", addItem)

	http.ListenAndServe(":8080", nil)
}
