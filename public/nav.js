let navUl = document.getElementById('navUl');

let feesList = document.createElement('li');
let teacherList = document.createElement('li');
let studentList = document.createElement('li');
let subjectList = document.createElement('li');
let classesList = document.createElement('li');
let attendanceList = document.createElement('li');
let resultList = document.createElement('li');
let cumulativeResult = document.createElement('li');

let feesListBtn = document.createElement('button')
let teacherListBtn = document.createElement('button')
let studentListBtn = document.createElement('button')
let subjectListBtn = document.createElement('button')
let classesListBtn = document.createElement('button')
let attendanceBtn = document.createElement('button')
let resultBtn = document.createElement('button')
let cumulativeBtn = document.createElement('button')

feesListBtn.textContent = 'FEES/Management';
// myButton.classList.add("animated-btn"); // Add a class
teacherListBtn.textContent = 'REMARKS';
studentListBtn.textContent = 'STUDENTS';
subjectListBtn.textContent = 'SUBJECTS';
classesListBtn.textContent = 'CLASSES';
attendanceBtn.textContent = 'ATTENDANCE';
resultBtn.textContent = 'RESULT';
cumulativeBtn.textContent = 'Cumulative Result';

feesList.appendChild(feesListBtn);
classesList.appendChild(classesListBtn);
teacherList.appendChild(teacherListBtn);
studentList.appendChild(studentListBtn);
subjectList.appendChild(subjectListBtn);
attendanceList.appendChild(attendanceBtn);
resultList.appendChild(resultBtn);
cumulativeResult.appendChild(cumulativeBtn)

feesListBtn.addEventListener('click', function(){
    window.location.href = `index.html`;
})

classesListBtn.addEventListener('click', function(){
    window.location.href = `classes.html`;
})

teacherListBtn.addEventListener('click', function(){
    window.location.href = `teacherRemark.html`;
})

studentListBtn.addEventListener('click', function(){
    window.location.href = `student.html`;
})

subjectListBtn.addEventListener('click', function(){
    window.location.href = `subject.html`;
})

attendanceBtn.addEventListener('click', function(){
    window.location.href = `attendance.html`;
})

resultBtn.addEventListener('click', function(){
    window.location.href = `result.html`;
})

cumulativeBtn.addEventListener('click', function(){
    window.location.href = `selectCumulative.html`;
})

navUl.appendChild(feesList);
navUl.appendChild(classesList)
navUl.appendChild(teacherList)
navUl.appendChild(attendanceList)
navUl.appendChild(subjectList)
navUl.appendChild(studentList)
navUl.appendChild(resultList)
navUl.appendChild(cumulativeResult)

// nav.js
const links = document.querySelectorAll('.nav-link');
links.forEach(link => {
  if (link.href === window.location.href) {
    link.classList.add('active');
  }
});



