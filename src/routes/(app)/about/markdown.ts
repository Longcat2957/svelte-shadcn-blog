export const md = `# About (Markdown Test)

Lorem ipsum dolor sit amet, **consectetur adipiscing elit**.

## 리스트

- Item 1
- Item 2
- Item 3

## 코드

### Svelte
\`\`\`svelte
<script>
  let count = $state(0);

  function increment() {
    count += 1;
  }
</script>

<button onclick={increment}>
  Clicks: {count}
</button>
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

### C++
\`\`\`cpp
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
\`\`\`

## 인용문

> This is a blockquote.

## 테이블 (GFM)

| Col A | Col B |
| ----: | :---- |
| 1     | left  |
| 2     | right |
`;
