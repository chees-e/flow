# Milestone 1

Our project idea is to create a call graph visualization tool for JavaScript using JavaScript. We will employ D3.js and acornjs/esprima as libraries to help with the parsing and creating the visualization. Our analysis will be a sequence diagram of the functions (static), runtime of each of the functions (dynamic), as well as a possible estimate of the big-O runtime (static). Our target user would be anyone who is familiar with JavaScript development and wants to either find out the call sequence of the code they are working on, or improve the performance of their code using the time complexity analysis. It would be helpful because IDEs typically do not have features such as call graphs or sequence diagrams, as well as time complexity analysis.

We roughly divided up the tasks into frontend and backend tasks. We hope to conduct the prototype user study at some point early next week while we work on the project itself, then complete the task-driven user study next weekend, so we will have time to collect the results and create the video before the due date.

# Milestone 2

Our project is to create a call graph visualization tool for JavaScript. We are using the analysis library Espree to parse the JavaScript files and build the AST, and the library Estraverse to visit the AST. 

We have completed our prototype user studies and the majority of our back-end code (getting the list of function calls needed as input to make the call graph). We just need to parse the list of function calls into the format needed to create the graph using Mermaid-js. The front-end (made with React) is completed to the point where we can just connect it to the back-end once the code is finished. 

The feedback from our prototype user studies was that call graphs are a useful visualization tool as it is way easier to see the relationship between different functions in the graph form rather than looking through each line of code. Feedback on features to possibly include are the number of calls made and to improve design of the call graph for better readability.  

The project scope has decreased to exclude the runtime analysis component as we are focusing our efforts to flesh out the visualization component and creating our call graph from scratch. We have discussed this change with our TA and he has greenlit our plan. 

The remaining timeline is to finish all the code by Sunday. Concurrently, we will design the task-driven user study by Sunday and conduct the studies on Sunday. Finally, we will make the video on Monday.
