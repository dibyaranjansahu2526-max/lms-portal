package com.lms.config;

import java.util.List;

final class MockTestSeedCatalog {

    private MockTestSeedCatalog() {
    }

    static List<TestSeed> tests() {
        return List.of(
                t("Java Basics Mock Test",
                        "A focused check of Java syntax, collections, exceptions and the JVM. Each question has four options and one correct answer.",
                        "Programming", 15, 10, 1, 0.25,
                        q("Which keyword is used to inherit a class in Java?", 1,
                                "implements", "extends", "inherits", "super"),
                        q("Which primitive type stores whole numbers?", 0,
                                "int", "String", "boolean", "double"),
                        q("Which method is the entry point of a Java application?", 1,
                                "start()", "main()", "run()", "init()"),
                        q("Which collection does not allow duplicate elements?", 1,
                                "List", "Set", "ArrayList", "LinkedList"),
                        q("What does JVM stand for?", 0,
                                "Java Virtual Machine", "Java Verified Module", "Java Variable Manager", "Just Virtual Machine"),
                        q("Which access modifier makes a member visible only inside its own class?", 2,
                                "public", "protected", "private", "default"),
                        q("Which operator checks equality of primitive values?", 1,
                                "=", "==", "=>", "equals"),
                        q("Which block runs whether or not an exception occurs?", 2,
                                "try", "catch", "finally", "throw"),
                        q("Which of these is a primitive type?", 2,
                                "String", "Integer", "boolean", "ArrayList"),
                        q("Which package contains the List interface?", 1,
                                "java.lang", "java.util", "java.io", "java.net")),

                t("DSA Mock Test",
                        "Test your understanding of complexity, linear structures, trees, hashing and graph traversal.",
                        "Computer Science", 20, 20, 2, 0.5,
                        q("What is the average lookup time of a hash map?", 2,
                                "O(n)", "O(log n)", "O(1)", "O(n log n)"),
                        q("Which data structure uses FIFO ordering?", 1,
                                "Stack", "Queue", "Tree", "Heap"),
                        q("Which traversal visits the root first?", 2,
                                "In-order", "Post-order", "Pre-order", "Level-order"),
                        q("Which data structure uses LIFO ordering?", 0,
                                "Stack", "Queue", "Graph", "Trie"),
                        q("What is the worst-case time complexity of binary search?", 1,
                                "O(1)", "O(log n)", "O(n)", "O(n log n)"),
                        q("Which traversal of a binary search tree visits values in sorted order?", 0,
                                "In-order", "Pre-order", "Post-order", "Level-order"),
                        q("Which data structure is commonly used to implement a priority queue?", 3,
                                "Array", "Linked list", "Stack", "Heap"),
                        q("Which of these is not a linear data structure?", 2,
                                "Array", "Queue", "Tree", "Linked list"),
                        q("What is the time complexity of inserting at the head of a linked list?", 0,
                                "O(1)", "O(log n)", "O(n)", "O(n log n)"),
                        q("Which algorithm finds the shortest path in an unweighted graph?", 1,
                                "DFS", "BFS", "Dijkstra", "Prim")),

                t("SQL Mock Test",
                        "Practise the SQL statements, clauses and keys used in everyday relational database work.",
                        "Database", 15, 10, 1, 0,
                        q("Which keyword retrieves rows from a table?", 0,
                                "SELECT", "INSERT", "UPDATE", "DELETE"),
                        q("Which clause filters rows in a query?", 1,
                                "GROUP BY", "WHERE", "ORDER BY", "HAVING"),
                        q("Which join returns only rows with matching values in both tables?", 0,
                                "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"),
                        q("Which aggregate function counts rows?", 2,
                                "SUM", "AVG", "COUNT", "MAX"),
                        q("Which statement adds a new row?", 1,
                                "SELECT", "INSERT", "ALTER", "CREATE"),
                        q("Which key uniquely identifies each row in a table?", 3,
                                "FOREIGN KEY", "CANDIDATE KEY", "COMPOSITE KEY", "PRIMARY KEY"),
                        q("Which clause sorts query results?", 2,
                                "WHERE", "GROUP BY", "ORDER BY", "LIMIT"),
                        q("Which operator matches a text pattern?", 1,
                                "BETWEEN", "LIKE", "IN", "EXISTS"),
                        q("Which function returns the current date?", 0,
                                "CURRENT_DATE", "DATE()", "NOW_DATE()", "TODAY()"),
                        q("Which statement removes a table and its structure?", 3,
                                "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE", "DROP TABLE")),

                t("React Mock Test",
                        "Review React components, hooks, JSX and the patterns used to build interactive interfaces.",
                        "Web Development", 20, 20, 2, 0.5,
                        q("Which hook stores local component state?", 1,
                                "useEffect", "useState", "useMemo", "useRef"),
                        q("Which prop should every item in a rendered list have?", 2,
                                "class", "style", "key", "id"),
                        q("Which hook runs side effects after rendering?", 0,
                                "useEffect", "useState", "useContext", "useReducer"),
                        q("What does JSX stand for?", 2,
                                "JavaScript Extension", "Java Syntax XML", "JavaScript XML", "JSON Syntax XML"),
                        q("Which array method is commonly used to render a list of elements?", 1,
                                "filter", "map", "reduce", "find"),
                        q("How is data passed from a parent component to a child component?", 0,
                                "Props", "State", "Context", "Refs"),
                        q("Which hook memoizes a computed value?", 3,
                                "useEffect", "useState", "useRef", "useMemo"),
                        q("Which prop attaches a click handler to a React element?", 1,
                                "onChange", "onClick", "onSubmit", "onLoad"),
                        q("Which command starts a Vite development server?", 2,
                                "npm start", "npm build", "npm run dev", "npm serve"),
                        q("Where should state shared by two sibling components live?", 0,
                                "In their closest common parent", "In each child", "In a CSS file", "In the browser URL")),

                t("Aptitude Mock Test",
                        "A quick numerical reasoning test covering percentages, ratios, averages, interest and probability.",
                        "Aptitude", 15, 10, 1, 0.25,
                        q("What is 15% of 200?", 2,
                                "15", "25", "30", "35"),
                        q("Two numbers are in the ratio 2:3 and their sum is 25. What is the smaller number?", 1,
                                "8", "10", "12", "15"),
                        q("What is the average of 4, 8, 12 and 16?", 2,
                                "8", "9", "10", "12"),
                        q("If 5 workers finish a job in 10 days, how long will 10 workers take at the same rate?", 1,
                                "10 days", "5 days", "4 days", "2 days"),
                        q("What is the simple interest on 1000 at 10% per year for 2 years?", 2,
                                "100", "150", "200", "250"),
                        q("Find the next number: 2, 6, 12, 20, ?", 3,
                                "24", "26", "28", "30"),
                        q("A train travels at 60 km/h. How far does it travel in 30 minutes?", 1,
                                "15 km", "30 km", "45 km", "60 km"),
                        q("An item costs 500 and receives a 20% discount. What is the final price?", 2,
                                "300", "350", "400", "450"),
                        q("What is the probability of getting heads when tossing a fair coin?", 1,
                                "1/4", "1/2", "2/3", "1"),
                        q("Solve for x: 3x + 5 = 20.", 3,
                                "3", "4", "6", "5"))
        );
    }

    private static TestSeed t(String title, String description, String category, int durationMinutes,
                              double totalMarks, double marksPerCorrect, double negativeMarks,
                              QuestionSeed... questions) {
        return new TestSeed(title, description, category, durationMinutes, totalMarks,
                marksPerCorrect, negativeMarks, List.of(questions));
    }

    private static QuestionSeed q(String text, int correctIndex, String... options) {
        return new QuestionSeed(text, List.of(options), correctIndex);
    }

    record TestSeed(
            String title,
            String description,
            String category,
            int durationMinutes,
            double totalMarks,
            double marksPerCorrect,
            double negativeMarks,
            List<QuestionSeed> questions
    ) {
    }

    record QuestionSeed(String text, List<String> options, int correctIndex) {
    }
}
