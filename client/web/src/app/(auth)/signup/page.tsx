"use client";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const schema = z
  .object({
    email: z.string().email({ message: "Invalid email" }),
    username: z.string().min(3, { message: "Username must be at least 3 characters" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormFields = z.infer<typeof schema>;

const SignupForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema) });

  const API_URL = "http://localhost:3000"

  const mutation = useMutation({
    mutationFn: async (data: FormFields) => {
      return axios.post(`${API_URL}/user/register`, {
        email: data.email,
        user_name: data.username,
        name: data.username,
        password_hash: data.password
      })
    },
    onSuccess: (response) => {
      console.log("signup successful : ", response.data)
    },
    onError: (error: any) => {
      console.error('Signup failed ', error.message)
    }
  })

  const onSubmit: SubmitHandler<FormFields> = (data) => {
    console.log("Form Data Submitted:", data);
    mutation.mutate(data);
  };

  return (
    <div className="px-10 pt-12 pb-10 mt-5 mb-4 max-w-full rounded-2xl bg-slate-50 w-[490px] max-md:px-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <h1 className="text-4xl font-semibold text-neutral-600 text-center">Signup</h1>

        {["username", "email", "password", "confirmPassword"].map((field) => (
          <div key={field} className="flex flex-col mt-4">
            <span className={errors[field] ? "text-red-500" : "text-neutral-800"}>
              {errors[field]?.message || field.charAt(0).toUpperCase() + field.slice(1)}
            </span>
            <Input {...register(field as keyof FormFields)} className="text-md" placeholder={`Enter ${field}`} />
            <div className="h-px border border-solid bg-neutral-400 border-neutral-400" />
          </div>
        ))}

        <button
          type="submit"
          className="justify-center items-center px-16 py-5 mt-10 text-xl rounded-[100px] text-white text-opacity-80 bg-gradient-to-r from-blue-700 to-purple-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Loading..." : "SIGNUP"}
        </button>
      </form>

      <Divider />
      <div className="w-full flex justify-center">
      </div>
      <div className="flex gap-1.5 self-center mt-7 text-[1.2rem]">
        <span className="text-neutral-500">Already have an account?</span>
        <a href="/login" className="text-purple-500">Login</a>
      </div>
    </div>
  );
};

const Divider: React.FC = () => (
  <div className="flex gap-2 mt-7 text-xl text-black whitespace-nowrap max-md:mt-10 ml-3">
    <div className="flex gap-1">
      <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
      <div>OR</div>
    </div>
    <div className="shrink-0 my-auto h-0.5 border border-solid bg-neutral-400 border-neutral-400 w-[175px]" />
  </div>
);

const MyComponent: React.FC = () => (
  <div className="flex flex-col justify-center text-base bg-gradient-to-tr to-[#A348DF] from-[#7143E2] h-screen">
    <div className="flex justify-center items-center px-16 py-20 w-full max-md:px-5 max-md:max-w-full">
      <div className="flex flex-col">
        <SignupForm />
      </div>
    </div>
  </div>
);

export default MyComponent;
