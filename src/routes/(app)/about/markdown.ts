export const md = `# About (Markdown Test)

Lorem ipsum dolor sit amet, **consectetur adipiscing elit**.

## 리스트

- Item 1
- Item 2
- Item 3

## 코드 블록 테스트

### Bash
\`\`\`bash
#!/bin/bash
echo "Hello, World!"
name="User"
echo "Welcome, $name"
\`\`\`

### C
\`\`\`c
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
\`\`\`

### C++
\`\`\`cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
\`\`\`

### C#
\`\`\`csharp
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
\`\`\`

### CSS
\`\`\`css
body {
    background-color: #f0f0f0;
    font-family: Arial, sans-serif;
}

.container {
    padding: 20px;
}
\`\`\`

### Go
\`\`\`go
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
\`\`\`

### Java
\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

### JavaScript
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);

function add(a, b) {
    return a + b;
}
\`\`\`

### JSON
\`\`\`json
{
    "name": "Svelte",
    "version": 5,
    "features": ["Runes", "Signal-based reactivity"]
}
\`\`\`

### Kotlin
\`\`\`kotlin
fun main() {
    println("Hello, World!")
    val items = listOf("apple", "banana", "kiwifruit")
    for (item in items) {
        println(item)
    }
}
\`\`\`

### Markdown
\`\`\`markdown
# Title

**Bold text** and *italic text*.

- List item 1
- List item 2
\`\`\`

### PHP
\`\`\`php
<?php
echo "Hello, World!";
$name = "User";
echo "Welcome, $name";
?>
\`\`\`

### Python
\`\`\`python
def fib(n):
    a, b = 0, 1
    while a < n:
        print(a, end=' ')
        a, b = b, a+b
    print()

fib(1000)
\`\`\`

### Ruby
\`\`\`ruby
class Greeter
  def initialize(name = "World")
    @name = name
  end
  
  def say_hi
    puts "Hi #{@name}!"
  end
end

g = Greeter.new("Svelte")
g.say_hi
\`\`\`

### Rust
\`\`\`rust
fn main() {
    println!("Hello, World!");
    let x = 5;
    let y = 10;
    println!("x + y = {}", x + y);
}
\`\`\`

### SQL
\`\`\`sql
SELECT id, username, email
FROM users
WHERE active = 1
ORDER BY created_at DESC;
\`\`\`

### Swift
\`\`\`swift
import Swift

print("Hello, World!")

let interestingNumbers = [
    "Prime": [2, 3, 5, 7, 11, 13],
    "Fibonacci": [1, 1, 2, 3, 5, 8],
    "Square": [1, 4, 9, 16, 25],
]
\`\`\`

### TypeScript
\`\`\`typescript
interface User {
    id: number;
    name: string;
}

const user: User = {
    id: 1,
    name: "Svelte User"
};

console.log(\`User: \${user.name}\`);
\`\`\`

### XML / HTML
\`\`\`xml
<note>
  <to>User</to>
  <from>Admin</from>
  <heading>Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>
\`\`\`

### YAML
\`\`\`yaml
name: svelte-project
version: 1.0.0
dependencies:
  svelte: ^5.0.0
  vite: ^5.0.0
\`\`\`

## 인용문

> This is a blockquote.

## 테이블 (GFM)

| Col A | Col B |
| ----: | :---- |
| 1     | left  |
| 2     | right |
`;
