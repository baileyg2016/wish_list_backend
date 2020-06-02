package main

import (
	"fmt"
	"net/http"
)

func hello(w http.ResponseWriter, req *http.Request) {
	fmt.Fprintf(w, "You have hit the endpoint");
}

func main() {
	http.HandleFunc("/", hello)

	http.ListenAndServe(":8080", nil)
}