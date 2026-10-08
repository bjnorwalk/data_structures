import { array, traceRecorder } from "./trace.js";

export function postfixTrace(parentheses = false) {
  const input = parentheses ? "(8-3)*2" : "3+4*2";
  const code = `int precedence(char op) { return op == '*' || op == '/' ? 2 : 1; }
void postfix(const char *in, char *out) {
  char stack[32]; int top = 0, used = 0;
  for (int i = 0; in[i] != '\\0'; i++) {
    char ch = in[i];
    if (ch >= '0' && ch <= '9') out[used++] = ch;
    else if (ch == '(') stack[top++] = ch;
    else if (ch == ')') {
      while (top && stack[top-1] != '(') out[used++] = stack[--top];
      assert(top > 0);
      top--;
    } else {
      while (top && stack[top-1] != '(' && precedence(stack[top-1]) >= precedence(ch))
        out[used++] = stack[--top];
      stack[top++] = ch;
    }
  }
  while (top) out[used++] = stack[--top];
  out[used] = '\\0';
}`;
  const t = traceRecorder(code),
    ops = [],
    output = [],
    state = (i) => ({
      arrays: [
        array("input tokens", [...input], [i]),
        array("operator stack · top at right", ops),
        array("postfix output", output),
      ],
      variables: { i, top: ops.length, used: output.length },
    });
  t.record(
    "",
    "This bounded example accepts single-digit operands and balanced parentheses. Operators wait on the stack until precedence permits output.",
    state(-1),
  );
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (/\d/.test(ch)) {
      output.push(ch);
      t.record(
        "if (ch >= '0' && ch <= '9') out[used++] = ch;",
        "Operands go straight to output; their relative order is preserved.",
        state(i),
      );
    } else if (ch === "(") {
      ops.push(ch);
      t.record(
        "else if (ch == '(') stack[top++] = ch;",
        "An opening parenthesis creates a precedence boundary.",
        state(i),
      );
    } else if (ch === ")") {
      while (ops.at(-1) !== "(") {
        output.push(ops.pop());
        t.record(
          "while (top && stack[top-1] != '(') out[used++] = stack[--top];",
          "Emit the enclosed operators before discarding the matching opening parenthesis.",
          state(i),
        );
      }
      ops.pop();
      t.record(
        "top--;",
        "Parentheses control order but never appear in postfix output.",
        state(i),
      );
    } else {
      const precedence = (op) => (op === "*" || op === "/" ? 2 : 1);
      while (
        ops.length &&
        ops.at(-1) !== "(" &&
        precedence(ops.at(-1)) >= precedence(ch)
      ) {
        output.push(ops.pop());
        t.record(
          "out[used++] = stack[--top];",
          "Emit an operator with at least the incoming precedence. Equal precedence is handled left to right.",
          state(i),
        );
      }
      ops.push(ch);
      t.record(
        "stack[top++] = ch;",
        `Push ${ch}; its operands have not both been emitted yet.`,
        state(i),
      );
    }
  }
  while (ops.length) {
    output.push(ops.pop());
    t.record(
      "while (top) out[used++] = stack[--top];",
      "After the input ends, drain pending operators from the stack.",
      state(input.length),
    );
  }
  t.record(
    "out[used] = '\\0';",
    "Terminate the C string. The stack is empty and output contains each operand/operator exactly once.",
    state(input.length),
  );
  return t.finish(
    output.join(""),
    `char out[32];postfix("${input}",out);assert(strcmp(out,"${parentheses ? "83-2*" : "342*+"}")==0);`,
  );
}

export function evaluateTrace() {
  const input = "83-2*";
  const code = `int evaluate(const char *tokens) {
  int stack[32], top = 0;
  for (int i = 0; tokens[i] != '\\0'; i++) {
    char ch = tokens[i];
    if (ch >= '0' && ch <= '9') stack[top++] = ch - '0';
    else {
      assert(top >= 2);
      int right = stack[--top];
      int left = stack[--top];
      stack[top++] = ch == '-' ? left - right : left * right;
    }
  }
  assert(top == 1);
  return stack[0];
}`;
  const t = traceRecorder(code),
    stack = [],
    variables = {},
    state = (i) => ({
      arrays: [
        array("postfix tokens", [...input], [i]),
        array("value stack · top at right", stack),
      ],
      variables: { ...variables, top: stack.length },
    });
  t.record(
    "",
    "This example uses subtraction and multiplication. A valid postfix expression leaves exactly one value.",
    state(-1),
  );
  [...input].forEach((ch, i) => {
    if (/\d/.test(ch)) {
      stack.push(Number(ch));
      t.record(
        "if (ch >= '0' && ch <= '9') stack[top++] = ch - '0';",
        "Convert the digit character into its integer value and push it.",
        state(i),
      );
    } else {
      variables.right = stack.pop();
      t.record(
        "int right = stack[--top];",
        "Pop the RIGHT operand first. Reversing this order changes subtraction and division.",
        state(i),
      );
      variables.left = stack.pop();
      t.record(
        "int left = stack[--top];",
        "Pop the left operand second.",
        state(i),
      );
      stack.push(
        ch === "-"
          ? variables.left - variables.right
          : variables.left * variables.right,
      );
      t.record(
        "stack[top++] = ch == '-' ? left - right : left * right;",
        "Apply the operator and replace the two operands with one result.",
        state(i),
      );
    }
  });
  variables.return = stack[0];
  t.record(
    "return stack[0];",
    "The expression evaluates to 10; a stack size other than one would indicate malformed input.",
    state(input.length),
  );
  return t.finish(10, 'assert(evaluate("83-2*")==10);');
}
